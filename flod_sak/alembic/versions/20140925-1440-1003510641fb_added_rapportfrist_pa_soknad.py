"""added rapportfrist pa soknad

Revision ID: 1003510641fb
Revises: baa761d8757
Create Date: 2014-09-25 14:40:18.478738

"""

# revision identifiers, used by Alembic.
revision = '1003510641fb'
down_revision = 'baa761d8757'

from alembic import op
import sqlalchemy as sa


def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.add_column('soknader', sa.Column('rapportfrist', sa.Date(), nullable=True))
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('soknader', 'rapportfrist')
    ### end Alembic commands ###
