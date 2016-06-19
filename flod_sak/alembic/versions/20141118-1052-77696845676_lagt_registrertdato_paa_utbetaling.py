"""lagt_registrertdato_paa_utbetaling

Revision ID: 77696845676
Revises: 5ab7770ab5e1
Create Date: 2014-11-18 10:52:57.698931

"""

# revision identifiers, used by Alembic.
revision = '77696845676'
down_revision = '5ab7770ab5e1'

from alembic import op
import sqlalchemy as sa


def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.add_column('utbetalinger', sa.Column('registrertdato', sa.Date(), nullable=True))
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('utbetalinger', 'registrertdato')
    ### end Alembic commands ###