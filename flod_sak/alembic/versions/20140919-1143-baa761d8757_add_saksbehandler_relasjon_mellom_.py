"""add saksbehandler relasjon mellom soknader og user

Revision ID: baa761d8757
Revises: 4018ef22f8f0
Create Date: 2014-09-19 11:43:34.471051

"""

# revision identifiers, used by Alembic.
revision = 'baa761d8757'
down_revision = '4018ef22f8f0'

from alembic import op
import sqlalchemy as sa


def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.create_table('users',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('uri', sa.String(length=255), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('uri')
    )
    op.add_column('soknader', sa.Column('saksbehandler_id', sa.INTEGER, nullable=True))
    op.create_foreign_key('soknader_saksbehandler_id_fk', 'soknader', 'users', ["saksbehandler_id"], ["id"])
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint('soknader_saksbehandler_id_fk', 'soknader')
    op.drop_column('soknader', 'saksbehandler_id')
    op.drop_table('users')
    ### end Alembic commands ###
